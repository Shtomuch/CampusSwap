using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Infrastructure.Data;
using CampusSwap.Infrastructure.Identity;
using CampusSwap.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace CampusSwap.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var databaseProvider = configuration["Database:Provider"] ?? "PostgreSQL";
        var connectionString = configuration.GetConnectionString(databaseProvider)
            ?? configuration.GetConnectionString("DefaultConnection");

        switch (databaseProvider.ToLower())
        {
            case "sqlite":
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlite(connectionString));
                break;
            case "postgresql":
            default:
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseNpgsql(connectionString));
                break;
        }

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<INotificationService, NotificationService>();

        // Authentication
        var jwtSecret = configuration["JwtSettings:Secret"] ?? "ThisIsASuperSecretKeyForDevelopmentOnly123456789";
        var key = Encoding.ASCII.GetBytes(jwtSecret);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = configuration["JwtSettings:Issuer"] ?? "CampusSwap",
                ValidateAudience = true,
                ValidAudience = configuration["JwtSettings:Audience"] ?? "CampusSwapUsers",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var path = context.HttpContext.Request.Path;

                    // Only process query string tokens for SignalR hubs
                    if (path.StartsWithSegments("/hubs"))
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            Console.WriteLine($"[JWT] 🔗 SignalR auth: Path={path}, Token length={accessToken.ToString().Length}");
                            context.Token = accessToken;
                        }
                        else
                        {
                            Console.WriteLine($"[JWT] ❌ SignalR auth: No token provided for {path}");
                        }
                    }
                    // For regular API endpoints, let the default token resolution handle Authorization header
                    else
                    {
                        Console.WriteLine($"[JWT] 🌐 API request: Path={path}, using Authorization header");
                    }

                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    var path = context.HttpContext.Request.Path;
                    Console.WriteLine($"[JWT] 🚫 Authentication failed: Path={path}, Error={context.Exception?.Message}");
                    return Task.CompletedTask;
                }
            };
        });

        return services;
    }
}